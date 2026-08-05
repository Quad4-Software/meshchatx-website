@php
    $page = 'error';
    $status = 500;
@endphp

@extends('layouts.app')

@section('content')
    <x-error-page :status="500" />
@endsection
