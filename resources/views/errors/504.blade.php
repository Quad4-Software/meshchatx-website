@php
    $page = 'error';
    $status = 504;
@endphp

@extends('layouts.app')

@section('content')
    <x-error-page :status="504" />
@endsection
