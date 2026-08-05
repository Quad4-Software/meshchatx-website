@php
    $page = 'error';
    $status = 503;
@endphp

@extends('layouts.app')

@section('content')
    <x-error-page :status="503" />
@endsection
